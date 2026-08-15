import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getLocalPageById,
  getLocalPages,
  insertLocalPage,
  reorderLocalPages,
  softDeleteLocalPage,
  updateLocalPage,
} from '@/db/page-repository';
import { CreatePageInput, Page, ReorderItem, UpdatePageInput } from '@/types/note';

export const PAGE_QUERY_KEYS = {
  all: ['pages'] as const,
  detail: (id: string) => ['pages', id] as const,
};

/**
 * Hook to retrieve all active pages ordered by position.
 *
 * @example
 * const { data: pages = [], isLoading } = usePages();
 */
export function usePages() {
  return useQuery<Page[]>({
    queryKey: PAGE_QUERY_KEYS.all,
    queryFn: getLocalPages,
  });
}

/**
 * Hook to retrieve a single active page by its UUID.
 *
 * @example
 * const { data: page, isLoading } = usePage('uuid-123');
 */
export function usePage(id: string) {
  return useQuery<Page | null>({
    queryKey: PAGE_QUERY_KEYS.detail(id),
    queryFn: () => getLocalPageById(id),
    enabled: Boolean(id),
  });
}

/**
 * Mutation hook to create a new page.
 *
 * @example
 * const { mutateAsync: createPage } = useCreatePage();
 * const newPage = await createPage({ title: 'Shopping' });
 */
export function useCreatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePageInput) => insertLocalPage(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGE_QUERY_KEYS.all });
    },
  });
}

interface UpdatePageVariables {
  id: string;
  input: UpdatePageInput;
}

/**
 * Mutation hook to update an existing page.
 *
 * @example
 * const { mutateAsync: updatePage } = useUpdatePage();
 * await updatePage({ id: 'uuid-123', input: { title: 'Updated' } });
 */
export function useUpdatePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: UpdatePageVariables) => updateLocalPage(id, input),
    onSuccess: (updatedPage) => {
      if (updatedPage) {
        queryClient.setQueryData(PAGE_QUERY_KEYS.detail(updatedPage.id), updatedPage);
      }
      queryClient.invalidateQueries({ queryKey: PAGE_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation hook to soft delete a page.
 *
 * @example
 * const { mutateAsync: deletePage } = useDeletePage();
 * await deletePage('uuid-123');
 */
export function useDeletePage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => softDeleteLocalPage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGE_QUERY_KEYS.all });
    },
  });
}

/**
 * Mutation hook to batch reorder pages.
 *
 * @example
 * const { mutateAsync: reorder } = useReorderPages();
 * await reorder([{ id: 'uuid-1', position: 0 }]);
 */
export function useReorderPages() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderItem[]) => reorderLocalPages(items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAGE_QUERY_KEYS.all });
    },
  });
}
