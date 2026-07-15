"use client"; 

import { useState, useEffect } from "react";
import Image from "next/image";

const images = [ 
    "/bg1.jpg",
    "/bg2.jpg",
    "/bg3.jpg",
];

export default function Hero() {

    const [index, setIndex] = useState(0);

    // 每 4 秒切换
    useEffect(() => {
        const timer = setInterval(() => {
            setIndex((i) => (i + 1) % images.length);
        },4000);
        
        return () => clearInterval(timer); // 清理定时器
    }, []);

    return (
        <div className="w-full h-72 md:h-96 overflow-hidden rounded-lg shadow-md relative">
            <Image
            src={images[index]}
            alt=""
            fill
            priority
            className="w-full h-[400px] object-cover rounded-xl fade opacity-100"
            />
            <div className="absolute inset-0 bg-[var(--hero-overlay)]"></div>
        </div>
    )
}