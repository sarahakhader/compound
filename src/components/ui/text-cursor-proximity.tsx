"use client"

import React, { CSSProperties, forwardRef, useRef } from "react"
import { motion, useAnimationFrame, useMotionValue, useTransform } from "motion/react"
import { useMousePositionRef } from "@/hooks/use-mouse-position-ref"

type CSSPropertiesWithValues = {
  [K in keyof CSSProperties]: string | number
}

interface StyleValue<T extends keyof CSSPropertiesWithValues> {
  from: CSSPropertiesWithValues[T]
  to: CSSPropertiesWithValues[T]
}

interface TextProps extends React.HTMLAttributes<HTMLSpanElement> {
  label: string
  styles: Partial<{
    [K in keyof CSSPropertiesWithValues]: StyleValue<K>
  }>
  containerRef: React.RefObject<HTMLDivElement | null>
  radius?: number
  falloff?: "linear" | "exponential" | "gaussian"
}

const TextCursorProximity = forwardRef<HTMLSpanElement, TextProps>(
  (
    {
      label,
      styles,
      containerRef,
      radius = 50,
      falloff = "linear",
      className,
      onClick,
      ...props
    },
    ref
  ) => {
    const letterRefs = useRef<(HTMLSpanElement | null)[]>([])
    const mousePositionRef = useMousePositionRef(containerRef)

    const letterCount = label.replace(/\s/g, "").length
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const letterProximities = useRef(Array.from({ length: letterCount }, () => useMotionValue(0)))

    const calculateDistance = (x1: number, y1: number, x2: number, y2: number) =>
      Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))

    const calculateFalloff = (distance: number): number => {
      const norm = Math.min(Math.max(1 - distance / radius, 0), 1)
      switch (falloff) {
        case "exponential": return Math.pow(norm, 2)
        case "gaussian":    return Math.exp(-Math.pow(distance / (radius / 2), 2) / 2)
        default:            return norm
      }
    }

    useAnimationFrame(() => {
      if (!containerRef.current) return
      const containerRect = containerRef.current.getBoundingClientRect()
      letterRefs.current.forEach((letterRef, index) => {
        if (!letterRef) return
        const rect = letterRef.getBoundingClientRect()
        const cx = rect.left + rect.width / 2 - containerRect.left
        const cy = rect.top + rect.height / 2 - containerRect.top
        const distance = calculateDistance(mousePositionRef.current.x, mousePositionRef.current.y, cx, cy)
        letterProximities.current[index].set(calculateFalloff(distance))
      })
    })

    const words = label.split(" ")
    let letterIndex = 0

    return (
      <span ref={ref} className={`${className} inline`} onClick={onClick} {...props}>
        {words.map((word, wordIndex) => (
          <span key={wordIndex} className="inline-block whitespace-nowrap">
            {word.split("").map((letter) => {
              const idx = letterIndex++
              const proximity = letterProximities.current[idx]
              // eslint-disable-next-line react-hooks/rules-of-hooks
              const transformedStyles = Object.entries(styles).reduce((acc, [key, value]) => {
                // eslint-disable-next-line react-hooks/rules-of-hooks
                acc[key] = useTransform(proximity, [0, 1], [value.from, value.to])
                return acc
              }, {} as Record<string, unknown>)

              return (
                <motion.span
                  key={idx}
                  ref={(el: HTMLSpanElement | null) => { letterRefs.current[idx] = el }}
                  className="inline-block"
                  aria-hidden="true"
                  style={transformedStyles as CSSProperties}
                >
                  {letter}
                </motion.span>
              )
            })}
            {wordIndex < words.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        ))}
        <span className="sr-only">{label}</span>
      </span>
    )
  }
)

TextCursorProximity.displayName = "TextCursorProximity"
export default TextCursorProximity
