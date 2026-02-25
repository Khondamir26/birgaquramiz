"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  return <Sonner position="top-right" richColors closeButton duration={2400} {...props} />
}

export { Toaster }
