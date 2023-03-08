import { Children } from 'react';
import useExperiment from 'hooks/useExperiment';

export function Experiment({ children, name }: { children: React.ReactNode; name: string }) {
  const isExperimentOn = useExperiment(name);

  const filteredChildren: any = [];
  Children.map(children, (child) => {
    if (
      // @ts-ignore fix up later
      (isExperimentOn && (child.type.displayName !== 'Variant' || child.props.name.toLowerCase() !== 'off')) ||
      // @ts-ignore fix up later
      (!isExperimentOn && child.type.displayName === 'Variant' && child.props.name.toLowerCase() === 'off')
    ) {
      filteredChildren.push(child);
    }
  });

  return <>{filteredChildren}</>;
}

export function Variant({ children }: { children: React.ReactNode; name: string }) {
  return <>{children}</>;
}
Variant.displayName = 'Variant';
