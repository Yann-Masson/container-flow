import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

interface PasswordSetupDialogProps {
  open: boolean;
  onComplete: () => void;
}

interface PasswordValidationResult { valid: boolean; reasons: string[] }

function validatePassword(pw: string): PasswordValidationResult {
  const reasons: string[] = [];
  if (pw.length < 12) reasons.push('At least 12 characters');
  if (!/[a-z]/.test(pw)) reasons.push('Lowercase letter required');
  if (!/[A-Z]/.test(pw)) reasons.push('Uppercase letter required');
  if (!/[0-9]/.test(pw)) reasons.push('Digit required');
  if (!/[^A-Za-z0-9]/.test(pw)) reasons.push('Symbol required');
  if (/(.)\1{3,}/.test(pw)) reasons.push('Avoid 4+ repeating characters');
  const common = ['password','admin','root','123456','wordpress'];
  if (common.includes(pw.toLowerCase())) reasons.push('Too common');
  return { valid: reasons.length === 0, reasons };
}

export default function PasswordSetupDialog({ open, onComplete }: PasswordSetupDialogProps) {
  const [rootPassword, setRootPassword] = useState('');
  const [metricsUser, setMetricsUser] = useState('metrics');
  const [metricsPassword, setMetricsPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [rootTouched, setRootTouched] = useState(false);
  const [metricsTouched, setMetricsTouched] = useState(false);

  const rootValidation = validatePassword(rootPassword);
  const metricsValidation = metricsPassword ? validatePassword(metricsPassword) : { valid: true, reasons: [] };

  useEffect(() => {
    if (!open) {
      setRootPassword('');
      setMetricsPassword('');
      setRootTouched(false);
      setMetricsTouched(false);
    }
  }, [open]);

  const canSubmit = rootValidation.valid && (!metricsPassword || metricsValidation.valid) && rootPassword.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await (window as any).electronAPI.passwords.setRootAndMetrics({
        rootPassword,
        metricsUser: metricsPassword ? metricsUser : undefined,
        metricsPassword: metricsPassword || undefined,
      });
      onComplete();
    } catch (e) {
      console.error('Failed setting passwords', e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Initial Credentials Required</DialogTitle>
          <DialogDescription>
            Provide the MySQL root password (used to manage project databases). Optionally set metrics user credentials.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium">MySQL Root Password<span className="text-red-500">*</span></label>
            <Input
              type="password"
              value={rootPassword}
              onChange={e => setRootPassword(e.target.value)}
              onBlur={() => setRootTouched(true)}
              placeholder="Enter strong root password"
            />
            {rootTouched && !rootValidation.valid && (
              <ul className="mt-1 text-xs text-red-500 list-disc list-inside">
                {rootValidation.reasons.map(r => <li key={r}>{r}</li>)}
              </ul>
            )}
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Metrics User (optional)</label>
              <span className="text-xs text-muted-foreground">Prometheus exporter</span>
            </div>
            <div className="grid gap-2">
              <Input value={metricsUser} onChange={e => setMetricsUser(e.target.value)} placeholder="metrics user" />
              <Input
                type="password"
                value={metricsPassword}
                onChange={e => setMetricsPassword(e.target.value)}
                onBlur={() => setMetricsTouched(true)}
                placeholder="Metrics password (optional)"
              />
              {metricsTouched && metricsPassword && !metricsValidation.valid && (
                <ul className="mt-1 text-xs text-red-500 list-disc list-inside">
                  {metricsValidation.reasons.map(r => <li key={r}>{r}</li>)}
                </ul>
              )}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
