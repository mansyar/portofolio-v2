import { toast } from 'sonner';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { FunctionReference, FunctionArgs, FunctionReturnType } from 'convex/server';

export function useToastMutation<T extends FunctionReference<"mutation">>(
  mutationFn: T,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    loadingMessage?: string;
    onSuccess?: (data: FunctionReturnType<T>) => void;
    onError?: (error: Error) => void;
  }
) {
  const mutation = useMutation(mutationFn);
  const [isPending, setIsPending] = useState(false);
  
  const mutate = async (args: FunctionArgs<T>): Promise<FunctionReturnType<T>> => {
    setIsPending(true);
    
    if (options?.loadingMessage) {
      const promise = mutation(args);
      
      toast.promise(promise, {
        loading: `$ ${options.loadingMessage}`,
        success: (data) => {
          setIsPending(false);
          options?.onSuccess?.(data);
          return `$ ${options.successMessage || 'Operation successful'}`;
        },
        error: (err) => {
          setIsPending(false);
          options?.onError?.(err);
          return `$ ${options.errorMessage || 'Operation failed'}: ${err.message || String(err)}`;
        },
      });
      
      return promise;
    }

    try {
      const result = await mutation(args);
      if (options?.successMessage) {
        toast.success(`$ ${options.successMessage}`);
      }
      options?.onSuccess?.(result);
      setIsPending(false);
      return result;
    } catch (error: unknown) {
      setIsPending(false);
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(`$ ${options?.errorMessage || 'Operation failed'}`, {
        description: msg
      });
      options?.onError?.(error instanceof Error ? error : new Error(msg));
      throw error;
    }
  };

  return {
    mutate,
    isPending,
  };
}
