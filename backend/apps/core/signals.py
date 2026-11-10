# signals.py — core domain event signal handlers
# Fired by service layer; consumed by Celery tasks + WebSocket broadcaster

from django.dispatch import Signal

# Domain signals (used by services to decouple layers)
lot_stage_advanced = Signal()        # args: lot, from_stage, to_stage, user
lot_scanned = Signal()               # args: lot, stage, user, device
qc_inspection_done = Signal()        # args: inspection, result
low_stock_detected = Signal()        # args: item, warehouse, current_qty, min_level
payment_received = Signal()          # args: payment, client
challan_status_changed = Signal()    # args: challan, old_status, new_status
attendance_punched = Signal()        # args: log, worker, punch_type
order_created = Signal()             # args: order, client, branch
payroll_approved = Signal()          # args: payroll_run, branch
