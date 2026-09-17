'use client'

import Link from 'next/link'
import { useNavigation } from '@/contexts/NavigationContext'
import type { ComponentProps } from 'react'

type Props = ComponentProps<typeof Link>

export function NavigationLink({ onClick, ...props }: Props) {
  const { startLoading } = useNavigation()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isExternal = typeof props.href === 'string' && (props.href.startsWith('http') || props.href.startsWith('//'))
    const isNewTab = props.target === '_blank'
    if (!isExternal && !isNewTab) {
      startLoading()
      window.dispatchEvent(new Event('close-mobile-sidebar'))
    }
    onClick?.(e)
  }

  return <Link {...props} onClick={handleClick} />
}
