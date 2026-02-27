
-- Function A: Acknowledge Alert
CREATE OR REPLACE FUNCTION public.acknowledge_admin_alert(p_alert_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_already_acked boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN false; END IF;

  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = v_user_id AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN RETURN false; END IF;

  -- Check idempotency: Has this user acknowledged this alert today?
  SELECT EXISTS (
      SELECT 1 FROM admin_messages 
      WHERE alert_id = p_alert_id 
      AND author_id = v_user_id 
      AND action_type = 'acknowledge'
      AND created_at >= date_trunc('day', now())
  ) INTO v_already_acked;

  IF v_already_acked THEN
      RETURN true; -- Treat as success but skip insert
  END IF;

  INSERT INTO admin_messages (alert_id, author_id, author_role, message, action_type)
  VALUES (p_alert_id, v_user_id, 'admin', 'Alert acknowledged', 'acknowledge');

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

-- Function B: Snooze Alert
CREATE OR REPLACE FUNCTION public.snooze_admin_alert(p_alert_id uuid, p_until timestamptz)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_snooze_msg text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN false; END IF;

  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = v_user_id AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN RETURN false; END IF;

  -- Format timestamp for US Central in the message (best effort in SQL, better in JS but required here)
  v_snooze_msg := 'Alert snoozed until ' || to_char(p_until AT TIME ZONE 'America/Chicago', 'YYYY-MM-DD HH24:MI:SS') || ' CT';

  INSERT INTO admin_messages (alert_id, author_id, author_role, message, action_type)
  VALUES (p_alert_id, v_user_id, 'admin', v_snooze_msg, 'snooze');

  -- Ideally we might update a 'snoozed_until' column on admin_alerts if it existed, but per spec we only log message here.
  
  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;

-- Function C: Resolve Alert
CREATE OR REPLACE FUNCTION public.resolve_admin_alert(p_alert_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid;
  v_is_admin boolean;
  v_alert_status timestamptz;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RETURN false; END IF;

  SELECT EXISTS (SELECT 1 FROM profiles WHERE user_id = v_user_id AND role = 'admin') INTO v_is_admin;
  IF NOT v_is_admin THEN RETURN false; END IF;

  -- Log the resolution action
  INSERT INTO admin_messages (alert_id, author_id, author_role, message, action_type)
  VALUES (p_alert_id, v_user_id, 'admin', 'Alert resolved', 'resolve');

  -- Check if already resolved to avoid overwriting original resolution time
  SELECT resolved_at INTO v_alert_status FROM admin_alerts WHERE id = p_alert_id;
  
  IF v_alert_status IS NULL THEN
      UPDATE admin_alerts 
      SET resolved_at = now() 
      WHERE id = p_alert_id;
  END IF;

  RETURN true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$function$;
