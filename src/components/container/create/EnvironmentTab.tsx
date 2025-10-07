import { Dispatch, SetStateAction } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card.tsx';
import { Input } from '../../ui/input.tsx';
import { Button } from '../../ui/button.tsx';
import { TabsContent } from '../../ui/tabs.tsx';
import { KeyValuePair } from './types.ts';

interface EnvironmentTabProps {
    envVars: KeyValuePair[];
    setEnvVars: Dispatch<SetStateAction<KeyValuePair[]>>;
    labels: KeyValuePair[];
    setLabels: Dispatch<SetStateAction<KeyValuePair[]>>;
}

export function EnvironmentTab({ envVars, setEnvVars, labels, setLabels }: EnvironmentTabProps) {
    return (
        <TabsContent value='env' className='mt-4 space-y-6'>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className='space-y-6'
            >
                {/* Environment Variables Card */}
                <Card className='relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>
                            Environment Variables
                        </CardTitle>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setEnvVars([...envVars, { key: '', value: '' }])}
                            className='hover:scale-[1.03] active:scale-[0.97] transition mb-3'
                        >
                            <Plus className='h-4 w-4 mr-1' />
                            Add Variable
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-2'>
                            {envVars.map((env, index) => (
                                <motion.div
                                    key={index}
                                    layout
                                    className='flex gap-2 items-center group/env'
                                >
                                    <Input
                                        placeholder='KEY'
                                        value={env.key}
                                        onChange={(e) => {
                                            const newEnvVars = [...envVars];
                                            newEnvVars[index].key = e.target.value;
                                            setEnvVars(newEnvVars);
                                        }}
                                        className='flex-1'
                                    />
                                    <span>=</span>
                                    <Input
                                        placeholder='value'
                                        value={env.value}
                                        onChange={(e) => {
                                            const newEnvVars = [...envVars];
                                            newEnvVars[index].value = e.target.value;
                                            setEnvVars(newEnvVars);
                                        }}
                                        className='flex-1'
                                    />
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='sm'
                                        onClick={() =>
                                            setEnvVars(envVars.filter((_, i) => i !== index))
                                        }
                                        className='opacity-60 group-hover/env:opacity-100 transition'
                                    >
                                        <Trash2 className='h-4 w-4' />
                                    </Button>
                                </motion.div>
                            ))}
                            {envVars.length === 0 && (
                                <p className='text-sm text-muted-foreground text-center py-4'>
                                    No environment variables defined. Click "Add Variable" to add
                                    one.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Labels Card */}
                <Card className='relative border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.07]'>
                    <CardHeader className='flex flex-row items-center justify-between'>
                        <CardTitle className='text-[13px] tracking-wide uppercase text-white/70'>
                            Labels
                        </CardTitle>
                        <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            onClick={() => setLabels([...labels, { key: '', value: '' }])}
                            className='hover:scale-[1.03] active:scale-[0.97] transition mb-3'
                        >
                            <Plus className='h-4 w-4 mr-1' />
                            Add Label
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className='space-y-2'>
                            {labels.map((label, index) => (
                                <motion.div
                                    key={index}
                                    layout
                                    className='flex gap-2 items-center group/label'
                                >
                                    <Input
                                        placeholder='label.key'
                                        value={label.key}
                                        onChange={(e) => {
                                            const newLabels = [...labels];
                                            newLabels[index].key = e.target.value;
                                            setLabels(newLabels);
                                        }}
                                        className='flex-1'
                                    />
                                    <span>=</span>
                                    <Input
                                        placeholder='value'
                                        value={label.value}
                                        onChange={(e) => {
                                            const newLabels = [...labels];
                                            newLabels[index].value = e.target.value;
                                            setLabels(newLabels);
                                        }}
                                        className='flex-1'
                                    />
                                    <Button
                                        type='button'
                                        variant='ghost'
                                        size='sm'
                                        onClick={() =>
                                            setLabels(labels.filter((_, i) => i !== index))
                                        }
                                        className='opacity-60 group-hover/label:opacity-100 transition'
                                    >
                                        <Trash2 className='h-4 w-4' />
                                    </Button>
                                </motion.div>
                            ))}
                            {labels.length === 0 && (
                                <p className='text-sm text-muted-foreground text-center py-4'>
                                    No labels defined. Click "Add Label" to add one.
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </TabsContent>
    );
}
