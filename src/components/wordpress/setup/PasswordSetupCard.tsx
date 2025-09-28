import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

interface PasswordSetupCardProps {
  onComplete: () => void;
}

function validatePassword(pw: string) {
  const reasons: string[] = [];
  if (pw.length < 12) reasons.push('At least 12 characters');
  if (!/[a-z]/.test(pw)) reasons.push('Add lowercase letter');
  if (!/[A-Z]/.test(pw)) reasons.push('Add uppercase letter');
  if (!/[0-9]/.test(pw)) reasons.push('Add a digit');
  if (!/[^A-Za-z0-9]/.test(pw)) reasons.push('Add a symbol');
  if (/(.)\1{3,}/.test(pw)) reasons.push('Avoid 4+ repeated chars');
  const weak = ['password','admin','root','123456','wordpress'];
  if (weak.includes(pw.toLowerCase())) reasons.push('Too common / weak');
  return { valid: reasons.length === 0, reasons };
}

export default function PasswordSetupCard({ onComplete }: PasswordSetupCardProps) {
  const [loading, setLoading] = useState(true);
  const [rootPassword, setRootPassword] = useState('');
  const [metricsUser, setMetricsUser] = useState('metrics');
  const [metricsPassword, setMetricsPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const rootValidation = validatePassword(rootPassword);
  const metricsValidation = validatePassword(metricsPassword);
  const canSubmit = rootValidation.valid && metricsValidation.valid && rootPassword && metricsPassword;

  useEffect(() => {
    (async () => {
      try {
        const s = await (window as any).electronAPI.passwords.status();
        if (!s.initialized) {
          await (window as any).electronAPI.passwords.discover();
        }
        const refreshed = await (window as any).electronAPI.passwords.status();
        if (refreshed.rootPresent && refreshed.metricsPresent) {
          onComplete();
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.warn('Password status fetch failed', e);
        setLoading(false);
      }
    })();
  }, [onComplete]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await (window as any).electronAPI.passwords.setRootAndMetrics({
        rootPassword,
        metricsUser,
        metricsPassword,
      });
      await (window as any).electronAPI.passwords.discover();
      const refreshed = await (window as any).electronAPI.passwords.status();
      if (refreshed.rootPresent && refreshed.metricsPresent) {
        onComplete();
      }
    } catch (e) {
      console.error('Failed to set credentials', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Loader2 className="animate-spin h-6 w-6 text-gray-500" />
    );
  }

  return (
    <Card
        variant="glass"
        accent="glow"
        interactive={false}
        withHoverOverlay
        className="w-full max-w-xl"
    >
      <CardHeader>
        <CardTitle>Initial Credentials Required</CardTitle>
        <CardDescription>
          Enter the MySQL root password and metrics user password. These are required before setting up WordPress services.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="rootPassword">MySQL Root Password</Label>
          <Input
            id="rootPassword"
            type="password"
            value={rootPassword}
            onChange={e => setRootPassword(e.target.value)}
            placeholder="Strong root password"
          />
          {!rootValidation.valid && rootPassword && (
            <ul className="mt-1 text-xs text-red-500 list-disc list-inside">
              {rootValidation.reasons.map(r => <li key={r}>{r}</li>)}
            </ul>
          )}
        </div>
        <Separator />
        <div className="space-y-2">
          <Label htmlFor="metricsUser">Metrics User</Label>
          <Input
            id="metricsUser"
            value={metricsUser}
            onChange={e => setMetricsUser(e.target.value)}
            placeholder="metrics"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="metricsPassword">Metrics Password</Label>
          <Input
            id="metricsPassword"
            type="password"
            value={metricsPassword}
            onChange={e => setMetricsPassword(e.target.value)}
            placeholder="Strong metrics password"
          />
          {!metricsValidation.valid && metricsPassword && (
            <ul className="mt-1 text-xs text-red-500 list-disc list-inside">
              {metricsValidation.reasons.map(r => <li key={r}>{r}</li>)}
            </ul>
          )}
        </div>
        <Button className="w-full" disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? 'Saving...' : 'Save & Continue'}
        </Button>
      </CardContent>
    </Card>
  );
}
