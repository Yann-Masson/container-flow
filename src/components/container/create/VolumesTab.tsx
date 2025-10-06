import { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card.tsx';
import { Input } from '../../ui/input.tsx';
import { Label } from '../../ui/label.tsx';
import { Button } from '../../ui/button.tsx';
import { Checkbox } from '@/components/ui/checkbox.tsx';
import { TabsContent } from '../../ui/tabs.tsx';
import { VolumeMapping } from './types.ts';

interface VolumesTabProps {
    volumes: VolumeMapping[];
    setVolumes: Dispatch<SetStateAction<VolumeMapping[]>>;
}

export function VolumesTab({ volumes, setVolumes }: VolumesTabProps) {
    return (
        <TabsContent value='volumes' className='mt-4 space-y-4'>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <Card className='relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>
                            Volume Mappings
                        </CardTitle>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() =>
                                setVolumes([
                                    ...volumes,
                                    { hostPath: '', containerPath: '', readOnly: false },
                                ])
                            }
                            className='hover:scale-[1.03] active:scale-[0.97] transition mb-3'
                        >
                            <Plus className='h-4 w-4 mr-1' />
                            Add Volume
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-3'>
                            {volumes.map((volume, index) => (
                                <motion.div
                                    key={index}
                                    layout
                                    className='flex gap-2 items-center group/volume'
                                >
                                    <Input
                                        placeholder='Host Path'
                                        value={volume.hostPath}
                                        onChange={(e) => {
                                            const newVolumes = [...volumes];
                                            newVolumes[index].hostPath = e.target.value;
                                            setVolumes(newVolumes);
                                        }}
                                        className='flex-1'
                                    />
                                    <span>:</span>
                                    <Input
                                        placeholder='Container Path'
                                        value={volume.containerPath}
                                        onChange={(e) => {
                                            const newVolumes = [...volumes];
                                            newVolumes[index].containerPath = e.target.value;
                                            setVolumes(newVolumes);
                                        }}
                                        className='flex-1'
                                    />
                                    <div className='flex items-center space-x-2'>
                                        <Checkbox
                                            id={`readonly-${index}`}
                                            checked={volume.readOnly}
                                            onCheckedChange={(checked) => {
                                                const newVolumes = [...volumes];
                                                newVolumes[index].readOnly = !!checked;
                                                setVolumes(newVolumes);
                                            }}
                                        />
                                        <Label htmlFor={`readonly-${index}`} className='text-sm'>
                                            RO
                                        </Label>
                                    </div>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='sm'
                                        onClick={() =>
                                            setVolumes(volumes.filter((_, i) => i !== index))
                                        }
                                        className='opacity-60 group-hover/volume:opacity-100 transition'
                                    >
                                        <Trash2 className='h-4 w-4' />
                                    </Button>
                                </motion.div>
                            ))}
                            {volumes.length === 0 && (
                                <p className='text-sm text-muted-foreground text-center py-4'>
                                    No volume mappings defined. Click "Add Volume" to add one.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    );
}
