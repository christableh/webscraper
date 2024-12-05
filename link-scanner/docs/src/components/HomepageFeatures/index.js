import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Web Scraping',
    Png: require('@site/static/img/brokenchain.png').default,
    description: (
      <>
        Web scrape effortlessly by inputing URLs of your choice.
      </>
    ),
  },
  {
    title: 'Link Checker',
    Png: require('@site/static/img/scraper.png').default,
    description: (
      <>
        Check links for liveness easily by inputing mutiple URLs of your choice
      </>
    ),
  },
];

function Feature({Png, title, description}) {
  return (
    <div className={clsx('col col--6')}>
      <div className="text--center">
      <img src={Png} className={styles.featureImg} alt={title} />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
