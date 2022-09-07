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
export default function useExperiment(name: string) {
  const { data } = useQuery(EXPERIMENTS_QUERY);
  const experiments = data?.experiments;

  if (!experiments) {
    return false;
  }

  return experiments.map((exp: EnabledExperiment) => exp.name).includes(name);
}
