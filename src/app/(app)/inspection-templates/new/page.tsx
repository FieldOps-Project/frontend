import { NewTemplateForm } from '@/features/templates/new-template-form'
import { loadTemplateCategories } from '@/features/templates/templates-data'
import { requireRole } from '@/lib/dal'
import { MANAGER_ROLES } from '@/lib/domain/user'

/** Criacao de modelo em rascunho (issue #13); ao salvar, abre o construtor. */
export default async function NewTemplatePage() {
  await requireRole(MANAGER_ROLES)
  const categories = await loadTemplateCategories()

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-neutral-200 pb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-neutral-950">Novo Modelo</h1>
        <p className="text-lg text-neutral-700">
          O modelo nasce como rascunho. Depois de criado, você monta as seções e os itens do checklist.
        </p>
      </header>

      <section className="rounded-card border border-neutral-200 bg-neutral-0 p-6 sm:p-8">
        <NewTemplateForm categories={categories} />
      </section>
    </div>
  )
}
