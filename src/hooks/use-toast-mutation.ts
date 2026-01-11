import { toast } from 'sonner';
import { useMutation } from 'convex/react';

export function useToastMutation(
  mutationFn: unknown,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  }
) {
  const mutation = useMutation(mutationFn as any);
  
  const execute = async (...args: any[]) => {
    try {
      const result = await (mutation as any)(...args);
      if (options?.successMessage) {
        toast.success(`$ ${options.successMessage}`);
      }
      options?.onSuccess?.(result);
      return result;
    } catch (error: any) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`$ ${options?.errorMessage || 'Operation failed'}`, {
        description: msg
      });
      options?.onError?.(error);
      throw error;
    }
  };

  return execute;
}
