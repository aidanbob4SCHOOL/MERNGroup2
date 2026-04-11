export type PanelType = 'error' | 'success' | 'warning' | 'info';

export interface PanelState {
  visible: boolean;
  type: PanelType;
  title: string;
  message: string;
}
