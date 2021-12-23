const BackgroundGrid = () => (
  <div className='relative h-60 w-full z-10'>
    <div className='absolute bottom-0 h-60 w-full z-10 from-gray-900 via-gray-900 to-transparent bg-gradient-to-br'></div>
    <img
      src="/images/backgrounds/background-grid.svg"
      alt=""
      className="absolute bottom-0 w-full h-full object-center object-cover"
    />
  </div>
)

export default BackgroundGrid