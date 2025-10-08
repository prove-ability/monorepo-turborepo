"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
}

export default function PageHeader({
  title,
  description,
  icon,
}: PageHeaderProps) {
  return (
    <motion.header
      className="mb-8"
      role="banner"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && (
            <motion.div
              aria-hidden="true"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
            >
              {icon}
            </motion.div>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
      </div>
      {description && (
        <motion.p
          className="text-sm text-gray-600 mt-1.5"
          role="doc-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {description}
        </motion.p>
      )}
    </motion.header>
  );
}
