import MyProfileImage from '@/components/profile/my-profile-image'
import MyProfileLanguage from '@/components/profile/my-profile-language'
import MyProfileUsername from '@/components/profile/my-profile-username'
import MyProfileWallet from '@/components/profile/my-profile-wallet'

export default function MyProfileTemplate() {
  return (
    <>
      <MyProfileUsername />
      <MyProfileLanguage />
      <MyProfileImage />
      <MyProfileWallet />
    </>
  )
}
