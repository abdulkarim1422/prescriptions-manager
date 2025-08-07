import { jsxRenderer } from 'hono/jsx-renderer'
import { Link, ViteClient } from 'vite-ssr-components/hono'

export const renderer = jsxRenderer(({ children }) => {
  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Prescriptions Manager - Medical Practice Management</title>
        <meta name="description" content="Modern prescription management system for healthcare professionals. Create, search, and manage prescription templates efficiently." />
        <ViteClient />
        <Link href="/src/style.css" rel="stylesheet" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
})
