export { default, getStaticProps } from './builder';

export const getStaticPaths = () => ({
  paths: [
    { params: { id: 'financial-inclusion-training-programme' } },
    { params: { id: 'new' } },
  ],
  fallback: 'blocking',
});
