import { styled } from 'components';

export const Message = styled('div')`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
`;

export const Emoji = styled('span')`
  font-size: 128px;
  height: 128px;
  line-height: 1;
  white-space: nowrap;
`;
