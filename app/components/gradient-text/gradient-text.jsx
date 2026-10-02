import { createGradientTextStyles } from '~/components/theme-provider/theme';

export const GradientText = ({
  children,
  gradient = 'primary',
  className = '',
  as: Component = 'span',
  ...props
}) => {
  const gradientStyles = createGradientTextStyles(gradient);

  return (
    <Component className={className} style={gradientStyles} {...props}>
      {children}
    </Component>
  );
};
