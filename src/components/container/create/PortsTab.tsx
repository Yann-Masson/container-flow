import { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card.tsx';
import { Input } from '../../ui/input.tsx';
import { Button } from '../../ui/button.tsx';
import { TabsContent } from '../../ui/tabs.tsx';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select.tsx';
import { PortMapping } from './types.ts';

interface PortsTabProps {
    ports: PortMapping[];
    setPorts: Dispatch<SetStateAction<PortMapping[]>>;
}

export function PortsTab({ ports, setPorts }: PortsTabProps) {
    return (
        <TabsContent value='ports' className='mt-4 space-y-4'>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
            >
                <Card className='relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>
                            Port Mappings
                        </CardTitle>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() =>
                                setPorts([
                                    ...ports,
                                    { containerPort: '', hostPort: '', protocol: 'tcp' },
                                ])
                            }
                            className='hover:scale-[1.03] active:scale-[0.97] transition mb-3'
                        >
                            <Plus className='h-4 w-4 mr-1' />
                            Add Port
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-2'>
                            {ports.map((port, index) => (
                                <motion.div
                                    key={index}
                                    layout
                                    className='flex gap-2 items-center group/port'
                                >
                                    <Input
                                        placeholder='Host Port'
                                        value={port.hostPort}
                                        onChange={(e) => {
                                            const newPorts = [...ports];
                                            newPorts[index].hostPort = e.target.value;
                                            setPorts(newPorts);
                                        }}
                                        className='flex-1'
                                    />
                                    <span>:</span>
                                    <Input
                                        placeholder='Container Port'
                                        value={port.containerPort}
                                        onChange={(e) => {
                                            const newPorts = [...ports];
                                            newPorts[index].containerPort = e.target.value;
                                            setPorts(newPorts);
                                        }}
                                        className='flex-1'
                                    />
                                    <Select
                                        value={port.protocol}
                                        onValueChange={(value: 'tcp' | 'udp') => {
                                            const newPorts = [...ports];
                                            newPorts[index].protocol = value;
                                            setPorts(newPorts);
                                        }}
                                    >
                                        <SelectTrigger className='w-20'>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value='tcp'>TCP</SelectItem>
                                            <SelectItem value='udp'>UDP</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='sm'
                                        onClick={() =>
                                            setPorts(ports.filter((_, i) => i !== index))
                                        }
                                        className='opacity-60 group-hover/port:opacity-100 transition'
                                    >
                                        <Trash2 className='h-4 w-4' />
                                    </Button>
                                </motion.div>
                            ))}
                            {ports.length === 0 && (
                                <p className='text-sm text-muted-foreground text-center py-4'>
                                    No port mappings defined. Click "Add Port" to add one.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    );
}
