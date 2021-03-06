/** @jsx jsx */
import Layout from '../components/layout'
import { jsx, Box, Flex, BaseStyles } from 'theme-ui'
import ScrollAnimation from '../components/animations/scrollAnimation'
import Header from '../components/header'
import { server } from '../config/server.js'
import InstallButton from '../components/installButton'
import Intro from '../components/intro.mdx'

const Index = props => {
  return (
    <Layout>
      <Box>
        <Header />
        <BaseStyles>
          <ScrollAnimation>
            <Flex sx={{ justifyContent: 'center' }}>
              <Box sx={{ my: 4, mx: 3, width: 600 }}>
                <Intro />
                <InstallButton url={props.data} />
              </Box>
            </Flex>
          </ScrollAnimation>
        </BaseStyles>
      </Box>
    </Layout>
  )
}

export default Index

Index.getInitialProps = async props => {
  const res = await fetch(`${server}/install`)
  const data = await res.json()
  return { data }
}
