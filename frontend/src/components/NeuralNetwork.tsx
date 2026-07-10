import { useEffect, useRef } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
}

interface Connection {
  from: number
  to: number
  pulse: number // 0-1, position of traveling signal
}

export function NeuralNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Create nodes
    const nodeCount = 20
    const nodes: Node[] = []
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2, // Very slow drift
        vy: (Math.random() - 0.5) * 0.2,
      })
    }

    // Create connections between nearby nodes
    const connections: Connection[] = []
    const maxDistance = 200
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          connections.push({
            from: i,
            to: j,
            pulse: Math.random(), // Random starting position
          })
        }
      }
    }

    let animationId: number

    function draw() {
      if (!ctx || !canvas) return

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Update and draw connections
      ctx.strokeStyle = 'rgba(24, 160, 24, 0.15)'
      ctx.lineWidth = 1

      connections.forEach((conn) => {
        const from = nodes[conn.from]
        const to = nodes[conn.to]

        // Draw connection line
        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()

        // Draw pulse traveling along connection
        const pulseX = from.x + (to.x - from.x) * conn.pulse
        const pulseY = from.y + (to.y - from.y) * conn.pulse

        ctx.fillStyle = '#18a018'
        ctx.beginPath()
        ctx.arc(pulseX, pulseY, 2, 0, Math.PI * 2)
        ctx.fill()

        // Update pulse position (slow movement)
        conn.pulse += 0.005
        if (conn.pulse > 1) {
          conn.pulse = 0
        }
      })

      // Draw nodes
      nodes.forEach((node) => {
        // Draw node
        ctx.fillStyle = 'rgba(24, 160, 24, 0.6)'
        ctx.beginPath()
        ctx.arc(node.x, node.y, 3, 0, Math.PI * 2)
        ctx.fill()

        // Draw glow
        const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, 10)
        gradient.addColorStop(0, 'rgba(24, 160, 24, 0.3)')
        gradient.addColorStop(1, 'rgba(24, 160, 24, 0)')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(node.x, node.y, 10, 0, Math.PI * 2)
        ctx.fill()

        // Update node position (very slow drift)
        node.x += node.vx
        node.y += node.vy

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full opacity-30 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
