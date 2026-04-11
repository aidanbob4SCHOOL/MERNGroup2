import React from 'react';
import { PanelType } from '../types/panel';
import './InfoPanel.css';

const ICONS: Record<PanelType, string> = {
  error:   '!',
  success: '✓',
  warning: '!',
  info:    'i',
};

interface InfoPanelProps {
  type: PanelType;
  title: string;
  message: string;
  visible: boolean;
  onClose: () => void;
}

function InfoPanel({ type, title, message, visible, onClose }: InfoPanelProps): JSX.Element {
  return (
    <div className={`info-panel ${visible ? 'visible' : ''}`}>
      <div className={`info-panel-header type-${type}`}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="info-icon">{ICONS[type]}</div>
          <span>{title}</span>
        </div>
        <button className="close-btn" onClick={onClose} title="Dismiss">&#x2715;</button>
      </div>
      <div className="info-panel-body">{message}</div>
    </div>
  );
}

export default InfoPanel;
