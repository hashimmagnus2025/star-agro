'use client';

import { motion } from 'framer-motion';

const OFFSETS = {
    up: { y: 40, x: 0, scale: 1 },
    down: { y: -40, x: 0, scale: 1 },
    left: { y: 0, x: 40, scale: 1 },
    right: { y: 0, x: -40, scale: 1 },
    scale: { y: 0, x: 0, scale: 0.92 },
    none: { y: 0, x: 0, scale: 1 },
};

export default function Reveal({
    children,
    as = 'div',
    direction = 'up',
    delay = 0,
    duration = 0.7,
    amount = 0.2,
    once = true,
    className = '',
}) {
    const MotionTag = motion[as] || motion.div;
    const offset = OFFSETS[direction] || OFFSETS.up;

    return (
        <MotionTag
            className={className}
            initial={{ opacity: 0, ...offset }}
            whileInView={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            viewport={{ once, amount }}
            transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </MotionTag>
    );
}
