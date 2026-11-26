ALTER TABLE organizations DROP COLUMN IF EXISTS password;
CREATE UNIQUE INDEX IF NOT EXISTS organization_membership_org_user_unique
    ON organization_membership ("orgId", "userId");
CREATE TABLE IF NOT EXISTS organization_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id),
    invited_by uuid NOT NULL,
    invited_user_id uuid NOT NULL,
    invited_email text NOT NULL,
    token_hash text NOT NULL UNIQUE,
    role member_role NOT NULL CHECK (role IN ('INTERVIEWER', 'ADMIN')),
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REVOKED')),
    expires_at timestamp NOT NULL,
    accepted_at timestamp,
    created_at timestamp NOT NULL DEFAULT now()
);
