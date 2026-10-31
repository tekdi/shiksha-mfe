export { default, getStaticProps } from './builder';

export const getStaticPaths = () => ({
  paths: [
    { params: { id: 'new' } },
  ],
  fallback: 'blocking',
});
