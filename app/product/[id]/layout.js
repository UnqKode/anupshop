import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export async function generateMetadata({ params }) {
  const { id } = params;
  try {
    const docSnap = await getDoc(doc(db, 'products', id));
    if (docSnap.exists()) {
      const product = docSnap.data();
      const title = `${product.name} | Aapnexa - Premium Essentials`;
      const description = `${product.description.slice(0, 150)}... - Premium ${product.category}. Experience the elite craftsmanship of Aapnexa.`;
      const image = product.image || product.imageUrl || '';

      return {
        title,
        description,
        openGraph: {
          title,
          description,
          url: `https://aapnexa.com/product/${id}`,
          siteName: 'Aapnexa',
          images: [{ url: image }],
          type: 'article',
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [image],
        },
      };
    }
  } catch (error) {
    console.error('Metadata generation error:', error);
  }

  return {
    title: 'Product Details | Aapnexa',
    description: 'Explore the premium collection of Aapnexa.',
  };
}

export default function ProductLayout({ children }) {
  return <>{children}</>;
}
