import React from 'react';

export interface ChannelIconProps {
  size?: number;
  className?: string;
}

/**
 * Logotipo oficial vectorial de WhatsApp
 */
export const WhatsAppLogo: React.FC<ChannelIconProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.868.514 3.616 1.408 5.116L2 22l4.996-1.385a9.96 9.96 0 005.008 1.393c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2zm5.83 14.284c-.244.686-1.217 1.302-1.988 1.467-.528.114-1.218.204-3.547-.758-2.977-1.23-4.873-4.259-5.022-4.458-.145-.2-1.198-1.593-1.198-3.04 0-1.446.758-2.158 1.026-2.452.268-.293.585-.367.78-.367.195 0 .39.002.56.012.183.008.427-.07.668.509.244.59.833 2.036.906 2.184.073.147.122.32.024.515-.097.195-.146.317-.292.49-.146.17-.306.382-.438.514-.146.146-.3.305-.13.598.17.293.758 1.252 1.628 2.025 1.118.996 2.06 1.305 2.353 1.451.293.146.463.122.634-.073.17-.195.732-.853.927-1.146.195-.293.39-.244.658-.146.268.097 1.707.805 2.001.951.293.147.488.22.56.342.074.122.074.708-.17 1.394z"
    />
  </svg>
);

/**
 * Logotipo oficial vectorial de Instagram
 */
export const InstagramLogo: React.FC<ChannelIconProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"
    />
  </svg>
);

/**
 * Logotipo oficial vectorial de Facebook / Messenger
 */
export const FacebookLogo: React.FC<ChannelIconProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
    />
  </svg>
);

/**
 * Logotipo representativo vectorial de Webchat (Widget de Chat con IA)
 */
export const WebchatLogo: React.FC<ChannelIconProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M20 3H4C2.9 3 2 3.9 2 5v14l4-4h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
      fill="currentColor"
      fillOpacity="0.18"
    />
    <path
      d="M20 3H4C2.9 3 2 3.9 2 5v14l4-4h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="7.5" cy="9.5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="9.5" r="1.2" fill="currentColor" />
    <circle cx="16.5" cy="9.5" r="1.2" fill="currentColor" />
  </svg>
);

/**
 * Logotipo representativo de Registro Manual en CRM
 */
export const ManualCrmLogo: React.FC<ChannelIconProps> = ({ size = 14, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="9"
      cy="7"
      r="4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19 8v6m3-3h-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
