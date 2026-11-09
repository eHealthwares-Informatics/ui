import { createContext, useContext, useState, ReactNode } from 'react';

type FormContextType<T> = {
  formState: T;
  setFormState: React.Dispatch<React.SetStateAction<T>>;
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  resetForm: () => void;
};

export function createFormContext<T>(defaultState: T) {
  const Context = createContext<FormContextType<T> | undefined>(undefined);

  function Provider({ children }: { children: ReactNode }) {
    const [formState, setFormState] = useState<T>(defaultState);

    const updateField = <K extends keyof T>(field: K, value: T[K]) => {
      setFormState((prev) => ({ ...prev, [field]: value }));
    };

    const resetForm = () => {
      setFormState(defaultState);
    };

    return (
      <Context.Provider value={{ formState, setFormState, updateField, resetForm }}>
        {children}
      </Context.Provider>
    );
  }

  function useForm() {
    const context = useContext(Context);
    if (!context) {
      throw new Error('useForm must be used within its Provider');
    }
    return context;
  }

  return { Provider, useForm };
}
