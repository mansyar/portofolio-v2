import { toast } from 'sonner';
import { useMutation } from 'convex/react';

export function useToastMutation(
  mutationFn: unknown,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onSuccess?: (data: any) => void;
    onError?: (error: Error) => void;
  }
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mutation = useMutation(mutationFn as any);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const execute = async (...args: any[]) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (mutation as any)(...args);
      if (options?.successMessage) {
        toast.success(`$ ${options.successMessage}`);
      }
      options?.onSuccess?.(result);
      return result;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`$ ${options?.errorMessage || 'Operation failed'}`, {
        description: msg
      });
      options?.onError?.(error instanceof Error ? error : new Error(msg));
      throw error;
    }
  };

  return execute;
}
