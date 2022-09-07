import { Children } from 'react';
import gql from 'graphql-tag';
import { useQuery } from '@apollo/client';

const EXPERIMENTS_QUERY = gql`
  {
    experiments @client {
      name
    }
  }
`;

// Custom hook to check for experiment being enabled.
export function useExperiment(name) {
  const { data } = useQuery(EXPERIMENTS_QUERY);
  const experiments = data?.experiments;

  if (!experiments) {
    return false;
  }

  return experiments.map((exp) => exp.name).includes(name);
}

export function Experiment({ children, name }) {
  const isExperimentOn = useExperiment(name);

  const filteredChildren = [];
  Children.map(children, (child) => {
    if (
      (isExperimentOn && (child.type.name !== 'Variant' || child.props.name.toLowerCase() !== 'off')) ||
      (!isExperimentOn && child.type.name === 'Variant' && child.props.name.toLowerCase() === 'off')
    ) {
      filteredChildren.push(child);
    }
  });

  return <>{filteredChildren}</>;
}

export function Variant({ children }) {
  return <>{children}</>;
}
