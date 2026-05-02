
import React from 'react';
import type { ModelInfo } from '../services/modelCapabilities';
import { useLocalization } from '../hooks/useLocalization';

interface ModelSelectorProps {
  id: string;
  label: string;
  value: string;
  onChange: (model: string) => void;
  models: ModelInfo[];
  isLoading: boolean;
  error: string | null;
  isFiltered: boolean;
  disabled?: boolean;
}

const WarningIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);

/**
 * Reusable model selector component with graceful degradation.
 *
 * Shows a <select> dropdown when models are available, falls back to
 * a text <input> when models can't be loaded or the list is empty.
 */
export const ModelSelector: React.FC<ModelSelectorProps> = ({
  id,
  label,
  value,
  onChange,
  models,
  isLoading,
  error,
  isFiltered,
  disabled = false,
}) => {
  const { t } = useLocalization();

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const isEffectivelyDisabled = disabled || isLoading;

  // Determine if we should show the fallback text input
  const showFallbackInput = !isLoading && !disabled && (error || models.length === 0);

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">
          {label}
        </label>
        {!isFiltered && !isLoading && !disabled && models.length > 0 && (
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-900/50 text-yellow-400 border border-yellow-700/50"
            title={t('model_select_all_models')}
          >
            <WarningIcon className="h-3 w-3" />
            {t('model_select_all_models')}
          </span>
        )}
      </div>

      {showFallbackInput ? (
        <div>
          <input
            id={id}
            type="text"
            value={value}
            onChange={handleInputChange}
            placeholder={t('model_select_manual_fallback')}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {error && (
            <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
              <WarningIcon className="h-3 w-3 flex-shrink-0" />
              {t('model_select_error')}: {error}
            </p>
          )}
          {!error && models.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              {t('model_select_no_models')}
            </p>
          )}
        </div>
      ) : (
        <div className="relative">
          <select
            id={id}
            value={value}
            onChange={handleSelectChange}
            disabled={isEffectivelyDisabled}
            className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8"
          >
            {isLoading ? (
              <option value="">{t('model_select_loading')}</option>
            ) : disabled ? (
              <option value="">{t('model_select_disabled')}</option>
            ) : (
              <>
                {!value && (
                  <option value="">{t('model_select_placeholder')}</option>
                )}
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name !== model.id
                      ? `${model.name} (${model.id})`
                      : model.id}
                  </option>
                ))}
              </>
            )}
          </select>
          {/* Dropdown arrow */}
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
