"use client"

import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import toast from "react-hot-toast"
import { useContactStore } from "@/lib/stores/contactStore"
import { useRouter, useParams } from "next/navigation"

const contactSchema = z.object({
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
  tags: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'CUSTOMER', 'LEAD']).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type ContactFormData = z.infer<typeof contactSchema>

export default function EditContactPage() {
  const router = useRouter()
  const params = useParams()
  const contactId = params.id as string
  const { contacts, updateContact, fetchContacts } = useContactStore()
  const [isLoading, setIsLoading] = useState(true)
  
  const contact = contacts.find(c => c.id === contactId)
  
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema)
  })

  useEffect(() => {
    const loadContact = async () => {
      if (!contact) {
        await fetchContacts()
      }
      setIsLoading(false)
    }
    loadContact()
  }, [contact, fetchContacts])

  useEffect(() => {
    if (contact) {
      setValue('firstName', contact.firstName)
      setValue('lastName', contact.lastName)
      setValue('email', contact.email || '')
      setValue('phone', contact.phone || '')
      setValue('company', contact.company || '')
      setValue('position', contact.position || '')
      setValue('address', contact.address || '')
      setValue('city', contact.city || '')
      setValue('state', contact.state || '')
      setValue('zipCode', contact.zipCode || '')
      setValue('country', contact.country || '')
      setValue('website', contact.website || '')
      setValue('notes', contact.notes || '')
      setValue('tags', Array.isArray(contact.tags) ? contact.tags.join(', ') : contact.tags || '')
      setValue('status', contact.status)
      setValue('latitude', contact.latitude || undefined)
      setValue('longitude', contact.longitude || undefined)
    }
  }, [contact, setValue])

  const onSubmit = async (data: ContactFormData) => {
    try {
      // Processar dados antes de enviar
      const processedData = {
        id: contactId,
        ...data,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        email: data.email && data.email.trim() !== '' ? data.email : undefined,
      }
      await updateContact(processedData)
      toast.success('Contato atualizado com sucesso!')
      router.push(`/contacts/${contactId}`)
    } catch (error: Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar contato'
      toast.error(errorMessage)
    }
  }

  const handleCancel = () => {
    router.push(`/contacts/${contactId}`)
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando contato...</span>
        </div>
      </AppLayout>
    )
  }

  if (!contact) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Contato não encontrado</h2>
          <p className="text-muted-foreground mb-6">O contato que você está tentando editar não foi encontrado.</p>
          <Button onClick={() => router.push('/contacts')}>Voltar para Contatos</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Editar Contato</h1>
            <p className="text-muted-foreground">
              Edite as informações de {contact.firstName} {contact.lastName}
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Contato</CardTitle>
            <CardDescription>
              Atualize as informações do contato
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações Básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Digite o nome"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Digite o sobrenome"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Contato */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="Digite o email"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    {...register('phone')}
                    placeholder="Digite o telefone"
                  />
                </div>
              </div>

              {/* Empresa */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    {...register('company')}
                    placeholder="Digite a empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Cargo</Label>
                  <Input
                    id="position"
                    {...register('position')}
                    placeholder="Digite o cargo"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={watch('status')} 
                  onValueChange={(value) => setValue('status', value as 'ACTIVE' | 'INACTIVE' | 'PROSPECT' | 'CUSTOMER' | 'LEAD')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PROSPECT">Prospect</SelectItem>
                    <SelectItem value="ACTIVE">Ativo</SelectItem>
                    <SelectItem value="CUSTOMER">Cliente</SelectItem>
                    <SelectItem value="INACTIVE">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Endereço */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Endereço</h3>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    {...register('address')}
                    placeholder="Digite o endereço"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Cidade</Label>
                    <Input
                      id="city"
                      {...register('city')}
                      placeholder="Digite a cidade"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      {...register('state')}
                      placeholder="Digite o estado"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP</Label>
                    <Input
                      id="zipCode"
                      {...register('zipCode')}
                      placeholder="Digite o CEP"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">País</Label>
                  <Input
                    id="country"
                    {...register('country')}
                    placeholder="Digite o país"
                  />
                </div>
              </div>

              {/* Informações Adicionais */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Informações Adicionais</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    {...register('website')}
                    placeholder="Digite o website"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    {...register('tags')}
                    placeholder="Digite as tags separadas por vírgula"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    placeholder="Digite observações sobre o contato"
                    rows={4}
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4 pt-6">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}