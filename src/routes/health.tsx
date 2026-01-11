import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/health')({
  component: Health,
})

function Health() {
  return (
    <html>
      <head>
        <title>Health Check</title>
      </head>
      <body>
        <pre>OK</pre>
      </body>
    </html>
  )
}
