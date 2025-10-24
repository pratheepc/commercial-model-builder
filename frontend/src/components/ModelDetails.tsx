import { useState } from 'react';
import { Model } from '@/types';
import { DynamicModelPlayground } from './DynamicModelPlayground';

interface ModelDetailsProps {
    model: Model;
    onBack: () => void;
}

export function ModelDetails({ model, onBack }: ModelDetailsProps) {

    // Always render the dynamic playground - simplified flow
    return <DynamicModelPlayground model={model} onBack={onBack} />;

}
