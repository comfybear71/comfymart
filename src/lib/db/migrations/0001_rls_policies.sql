-- Row-level security for tenant tables.
--
-- Auth.js tables (users, accounts, sessions, verification_tokens) are
-- intentionally NOT RLS-protected. They are only ever touched by the
-- server-side Auth.js adapter in trusted code paths; RLS on them would
-- break the login/session flow without adding real safety.
--
-- The three tenant tables (organizations, memberships, projects) are
-- RLS-protected with FORCE so even the table owner is subject to policy.

--------------------------------------------------------------------------
-- Helper functions
--------------------------------------------------------------------------

-- Current app-level user id (set via `SELECT set_config('app.user_id', ...)`
-- inside withUser()). Returns NULL when no context is set so that
-- policies fail closed rather than matching empty strings.
CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '');
$$ LANGUAGE sql STABLE;

-- SECURITY DEFINER so the policy helpers bypass RLS when inspecting
-- memberships; otherwise the policies would recurse into themselves.
CREATE OR REPLACE FUNCTION is_org_member(_org_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.org_id = _org_id
      AND m.user_id = app_current_user_id()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_org_owner(_org_id uuid) RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.org_id = _org_id
      AND m.user_id = app_current_user_id()
      AND m.role = 'owner'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Atomic "create org + owner membership". Required because the RLS
-- policies on memberships would otherwise reject a user's first insert
-- (they are not yet a member of the org they are creating).
CREATE OR REPLACE FUNCTION create_organization(_name text, _slug text)
RETURNS organizations AS $$
DECLARE
  _user_id text := app_current_user_id();
  _org organizations;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'create_organization called without user context';
  END IF;

  INSERT INTO organizations (name, slug)
    VALUES (_name, _slug)
    RETURNING * INTO _org;

  INSERT INTO memberships (org_id, user_id, role)
    VALUES (_org.id, _user_id, 'owner');

  RETURN _org;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

--------------------------------------------------------------------------
-- organizations
--------------------------------------------------------------------------
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE  ROW LEVEL SECURITY;

CREATE POLICY organizations_select ON organizations
  FOR SELECT USING (is_org_member(id));

-- Direct inserts are rejected; clients must call create_organization().
CREATE POLICY organizations_insert ON organizations
  FOR INSERT WITH CHECK (false);

CREATE POLICY organizations_update ON organizations
  FOR UPDATE USING (is_org_owner(id)) WITH CHECK (is_org_owner(id));

CREATE POLICY organizations_delete ON organizations
  FOR DELETE USING (is_org_owner(id));

--------------------------------------------------------------------------
-- memberships
--------------------------------------------------------------------------
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE  ROW LEVEL SECURITY;

CREATE POLICY memberships_select ON memberships
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY memberships_insert ON memberships
  FOR INSERT WITH CHECK (is_org_owner(org_id));

CREATE POLICY memberships_update ON memberships
  FOR UPDATE USING (is_org_owner(org_id)) WITH CHECK (is_org_owner(org_id));

-- Owners can remove members; any user can remove themselves.
CREATE POLICY memberships_delete ON memberships
  FOR DELETE USING (
    is_org_owner(org_id) OR user_id = app_current_user_id()
  );

--------------------------------------------------------------------------
-- projects
--------------------------------------------------------------------------
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE  ROW LEVEL SECURITY;

CREATE POLICY projects_select ON projects
  FOR SELECT USING (is_org_member(org_id));

CREATE POLICY projects_insert ON projects
  FOR INSERT WITH CHECK (
    is_org_member(org_id) AND created_by = app_current_user_id()
  );

CREATE POLICY projects_update ON projects
  FOR UPDATE USING (is_org_member(org_id)) WITH CHECK (is_org_member(org_id));

CREATE POLICY projects_delete ON projects
  FOR DELETE USING (is_org_member(org_id));
