import { GetServerSideProps } from 'next'

import { GhUser } from '../../interfaces'
import Layout from '../../components/Layout'

type Props = {
  ghUser: GhUser
}

const WithServerSideProps = ({ ghUser }: Props) => (
  <Layout title="Users List | Next.js + TypeScript Example">
    <div>name:{ghUser.name}</div>
    <div>location:{ghUser.location}</div>
    <img src={ghUser.avatar_url}/>
  </Layout>
)

export const getServerSideProps: GetServerSideProps = async () => {
  const res = await fetch('https://api.github.com/users/aYutaMatsunaga')
  const ghUser: GhUser = await res.json()
  return { props: { ghUser } }
}

export default WithServerSideProps
