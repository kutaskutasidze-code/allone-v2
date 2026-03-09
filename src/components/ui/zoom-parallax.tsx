'use client';

import { useScroll, useTransform, motion } from 'framer-motion';
import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageItem {
	src: string;
	alt?: string;
	objectPosition?: string;
}

interface ZoomParallaxProps {
	/** Array of images to be displayed in the parallax effect max 7 images */
	images: ImageItem[];
}

export function ZoomParallax({ images }: ZoomParallaxProps) {
	const container = useRef(null);
	const [isInView, setIsInView] = useState(true);

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => setIsInView(entry.isIntersecting),
			{ threshold: 0.01 }
		);
		if (container.current) observer.observe(container.current);
		return () => observer.disconnect();
	}, []);

	const { scrollYProgress } = useScroll({
		target: container,
		offset: ['start start', 'end end'],
	});

	const scale3 = useTransform(scrollYProgress, [0, 1], [1, 3]);
	const scale4 = useTransform(scrollYProgress, [0, 1], [1, 4]);
	const scale5 = useTransform(scrollYProgress, [0, 1], [1, 5]);
	const scale6 = useTransform(scrollYProgress, [0, 1], [1, 6]);
	const scale7 = useTransform(scrollYProgress, [0, 1], [1, 7]);

	const scales = [scale3, scale4, scale5, scale4, scale5, scale6, scale7];

	return (
		<div ref={container} className="relative h-[300vh]">
			<div className="sticky top-0 h-screen overflow-hidden">
				{isInView && images.map(({ src, alt, objectPosition }, index) => {
					const scale = scales[index % scales.length];

					return (
						<motion.div
							key={index}
							style={{ scale }}
							className={`absolute top-0 flex h-full w-full items-center justify-center will-change-transform ${index === 1 ? '[&>div]:!-top-[30vh] [&>div]:!left-[5vw] [&>div]:!h-[30vh] [&>div]:!w-[35vw]' : ''} ${index === 2 ? '[&>div]:!-top-[10vh] [&>div]:!-left-[25vw] [&>div]:!h-[45vh] [&>div]:!w-[20vw]' : ''} ${index === 3 ? '[&>div]:!left-[27.5vw] [&>div]:!h-[25vh] [&>div]:!w-[25vw]' : ''} ${index === 4 ? '[&>div]:!top-[27.5vh] [&>div]:!left-[5vw] [&>div]:!h-[25vh] [&>div]:!w-[20vw]' : ''} ${index === 5 ? '[&>div]:!top-[27.5vh] [&>div]:!-left-[22.5vw] [&>div]:!h-[25vh] [&>div]:!w-[30vw]' : ''} ${index === 6 ? '[&>div]:!top-[22.5vh] [&>div]:!left-[25vw] [&>div]:!h-[15vh] [&>div]:!w-[15vw]' : ''}`}
						>
							<div className={`relative overflow-hidden rounded-lg ${index === 0 ? 'w-[30vw] aspect-[16/10]' : 'h-[25vh] w-[25vw]'}`}>
								<Image
									src={src || '/placeholder.svg'}
									alt={alt || `Parallax image ${index + 1}`}
									fill
									className="object-cover"
									style={{ objectPosition: objectPosition || 'center' }}
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
									quality={100}
									priority={index <= 2}
								/>
							</div>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
}
