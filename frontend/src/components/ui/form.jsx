import { createContext, useContext, useId } from "react";
import { Controller, FormProvider, useFormContext, useFormState } from "react-hook-form";
import { cn } from "@/utils/cn";

const Form = FormProvider;

const FormFieldContext = createContext({});
const FormItemContext  = createContext({});

const FormField = ({ ...props }) => (
  <FormFieldContext.Provider value={{ name: props.name }}>
    <Controller {...props} />
  </FormFieldContext.Provider>
);

const useFormField = () => {
  const fieldCtx = useContext(FormFieldContext);
  const itemCtx  = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldCtx.name });
  const fieldState = getFieldState(fieldCtx.name, formState);
  if (!fieldCtx) throw new Error("useFormField must be used inside <FormField>");
  return { id: itemCtx.id, name: fieldCtx.name, formItemId: `${itemCtx.id}-item`, ...fieldState };
};

const FormItem = ({ className, ...props }) => {
  const id = useId();
  return (
    <FormItemContext.Provider value={{ id }}>
      <div className={cn("grid gap-1.5", className)} {...props} />
    </FormItemContext.Provider>
  );
};

const FormLabel = ({ className, ...props }) => {
  const { error, formItemId } = useFormField();
  return (
    <label
      htmlFor={formItemId}
      className={cn("text-sm font-medium leading-none", error && "text-destructive", className)}
      {...props}
    />
  );
};

const FormControl = ({ ...props }) => {
  const { error, formItemId } = useFormField();
  return <div id={formItemId} aria-invalid={!!error} {...props} />;
};

const FormMessage = ({ className, children, ...props }) => {
  const { error } = useFormField();
  const body = error ? String(error?.message ?? "") : children;
  if (!body) return null;
  return <p className={cn("text-xs text-destructive", className)} {...props}>{body}</p>;
};

const FormDescription = ({ className, ...props }) => (
  <p className={cn("text-xs text-muted-foreground", className)} {...props} />
);

export { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription };
