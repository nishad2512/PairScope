CREATE TABLE IF NOT EXISTS email_deliveries (
    event_id uuid PRIMARY KEY,
    recipient text NOT NULL,
    event_type text NOT NULL,
    status text NOT NULL DEFAULT 'processing'
        CHECK (status IN ('processing', 'pending', 'sent', 'skipped')),
    lease_until timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
