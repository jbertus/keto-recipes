
CREATE TABLE IF NOT EXISTS public.admin_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    alert_id uuid NOT NULL,
    author_id uuid,
    author_role text NOT NULL CHECK (author_role IN ('admin', 'system')),
    message text NOT NULL,
    action_type text CHECK (action_type IN ('acknowledge', 'snooze', 'resolve')),
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_messages_pkey PRIMARY KEY (id),
    CONSTRAINT admin_messages_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.admin_alerts(id) ON DELETE CASCADE,
    CONSTRAINT admin_messages_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS admin_messages_alert_id_created_at_idx ON public.admin_messages (alert_id, created_at);
CREATE INDEX IF NOT EXISTS admin_messages_author_role_idx ON public.admin_messages (author_role);

-- RLS Policies
ALTER TABLE public.admin_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts during re-runs
DROP POLICY IF EXISTS "Admins select all messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Service role insert messages" ON public.admin_messages;
DROP POLICY IF EXISTS "Admins insert general notes" ON public.admin_messages;

CREATE POLICY "Admins select all messages" ON public.admin_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Service role insert messages" ON public.admin_messages
    FOR INSERT
    WITH CHECK (true); -- Allows authenticated admins via RPC or service role
    
CREATE POLICY "Admins insert general notes" ON public.admin_messages
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
