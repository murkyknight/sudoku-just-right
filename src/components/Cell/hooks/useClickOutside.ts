import { useEffect, type RefObject } from 'react'

type UseClickOutsideProps<T extends HTMLElement> = {
  ref: RefObject<T | null>
  onClickOutside: (event: MouseEvent | TouchEvent) => void
}

export default function useClickOutside<T extends HTMLElement>({
  ref,
  onClickOutside,
}: UseClickOutsideProps<T>) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: passing ref.current is bad practice and redundant in react
  useEffect(() => {
    if (!ref.current) { return }

    const handleClickOutisde = (event: MouseEvent | TouchEvent) => {
      const node = event.target as Node | null

      if (node && !ref?.current?.contains(node)) {
        onClickOutside(event)
      }
    }

    document.addEventListener('mousedown', handleClickOutisde, true)
    document.addEventListener('touchstart', handleClickOutisde, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutisde, true)
      document.removeEventListener('touchstart', handleClickOutisde, true)
    }
  }, [onClickOutside])
}
