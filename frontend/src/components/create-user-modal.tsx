import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

interface CreateUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultClientId?: string
}

export function CreateUserModal({ open, onOpenChange, defaultClientId }: CreateUserModalProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  const [role, setRole] = useState(defaultClientId ? "CLIENT_USER" : "HR")
  
  const { data: clients } = useQuery({ 
    queryKey: ["clients"], 
    queryFn: api.clients.list, 
    enabled: !defaultClientId 
  })
  
  const [selectedClientId, setSelectedClientId] = useState<string>("")

  const createMutation = useMutation({
    mutationFn: api.users.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      toast.success("User created successfully")
      onOpenChange(false)
      reset()
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create user")
    },
  })

  const onSubmit = (data: any) => {
    // Validation
    if ((role === "CLIENT_ADMIN" || role === "CLIENT_USER") && !defaultClientId && !selectedClientId) {
        toast.error("Please select a client for this user")
        return
    }

    createMutation.mutate({ 
        ...data, 
        role, 
        client_id: defaultClientId || selectedClientId 
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Add a new user to the platform. They will be able to log in immediately.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" placeholder="jdoe" {...register("username", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="colleague@example.com" {...register("email", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password", { required: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {defaultClientId ? (
                  <>
                    <SelectItem value="CLIENT_ADMIN">Client Admin</SelectItem>
                    <SelectItem value="CLIENT_USER">Client User</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="SALES">Sales</SelectItem>
                    <SelectItem value="FINANCE">Finance</SelectItem>
                    <SelectItem value="CLIENT_ADMIN">Client Admin</SelectItem>
                    <SelectItem value="CLIENT_USER">Client User</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {!defaultClientId && (role === "CLIENT_ADMIN" || role === "CLIENT_USER") && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="client">Client</Label>
                <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                   <SelectContent>
                      {clients?.map((client: any) => (
                          <SelectItem key={client.id} value={client.id}>{client.company_name}</SelectItem>
                      ))}
                   </SelectContent>
                </Select>
              </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
