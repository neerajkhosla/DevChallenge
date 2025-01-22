'use client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Save, X } from 'lucide-react';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['Admin', 'User']),
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserDialogProps {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const defaultValues = {
  name: '',
  email: '',
  role: 'User' as const,
};

export function UserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: UserDialogProps) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      if (user) {
        form.reset({
          name: user.name,
          email: user.email,
          role: user.role as 'Admin' | 'User',
        });
      } else {
        form.reset(defaultValues);
      }
    }
  }, [open, user, form]);

  const onSubmit = async (values: UserFormValues) => {
    try {
      const url = user
        ? `http://localhost:3001/api/users/${user.id}`
        : 'http://localhost:3001/api/users';
      const method = user ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Failed to save user');

      toast({
        title: 'Success',
        description: `User ${user ? 'updated' : 'created'} successfully`,
      });
      onSuccess();
      form.reset(defaultValues);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save user',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold">
            {user ? 'Edit User' : 'Add New User'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input  {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Admin">Admin</SelectItem>
                      <SelectItem value="User">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset(defaultValues);
                  onOpenChange(false);
                }}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
              <Button type="submit" className="flex items-center gap-1">
                <Save className="h-4 w-4" />
                Save
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 