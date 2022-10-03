import MyProfileImage from '@/components/profile/my-profile-image'
import MyProfilePersonalSettings from '@/components/profile/my-profile-personal-settings'
import MyProfileUsername from '@/components/profile/my-profile-username'
import MyProfileWallet from '@/components/profile/my-profile-wallet'

export default function MyProfileTemplate() {
  return (
    <>
      <MyProfileUsername />
      <MyProfileImage />
      <MyProfileWallet />
      <MyProfilePersonalSettings />
    </>
  )
}
