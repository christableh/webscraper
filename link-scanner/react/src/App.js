import React, { useState, useCallback } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Button, TextField, Box, Typography, Tabs, Tab, ListItem, List, CircularProgress, Paper } from '@mui/material';
// import html2pdf from 'html2pdf.js';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


// Custom theme with hex colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#7393b3',  // Primary color using hex
      contrastText: '#FFFFFF',  // Text color for primary
    },
    secondary: {
      main: '#50667d',  // Secondary color using hex
      contrastText: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: `'Roboto', 'Georgia', 'sans-serif'`,
  },
});


function App() {
  const [url, setUrl] = useState('');  // For URL input
  const [error, setError] = useState(null);  // For displaying error messages
  const [livenessStatus, setLivenessStatus] = useState([]);  // State for liveness checking
  const [activeTab, setActiveTab] = useState(0);  // For managing tab selection
  const [scrapeResult, setScrapeResult] = useState(null);
  const [loading, setLoading] = useState(false);  // For spinner state
  const [livenessStatusMap, setLivenessStatusMap] = useState({});

  // Scraping function
  const handleScrape = async () => {
    setError(null);
    setLivenessStatus([]);
    setScrapeResult(null);
    setLoading(true);

    if (!url) {
        setError('Please enter at least one URL.');
        setLoading(false);
        return;
    }

    try {
        const response = await fetch('http://localhost:3002/scrape-summary', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
        });

        const textResponse = await response.text(); // Get raw response as text
        console.log('Raw response from backend:', textResponse); // Log to check exact format

        const result = JSON.parse(textResponse); // Parse the JSON after logging the raw response
        console.log('Parsed result from backend:', JSON.stringify(result, null, 2));

        if (result && result.result && result.result.categories) {
            const processedResult = processBackendData(result.result.categories);
            setScrapeResult(processedResult);
            console.log("Scrape Result after processing:", JSON.stringify(processedResult, null, 2));
        } else {
            throw new Error('Invalid or empty scrape result received.');
        }
    } catch (error) {
        console.error('Error during scraping:', error);
        setError(`Failed to scrape: ${error.message}`);
    } finally {
        setLoading(false);
    }
};

const cleanLink = (url) => {
  return url ? url.replace('/panorama', '') : '';
};
  
  // const handleCheckLivenessForScrapedLinks = async () => {
  //   setError(null); // Clear previous errors
  //   setLivenessStatus([]);
  //   if (!scrapeResult || !scrapeResult.categories) {
  //     setError('No links to check liveness for. Please scrape a URL first.');
  //     return;
  //   }
    
  //   const allLinks = [];
  
  //   // Collecting all links and embedded links
  //   const collectAllLinks = (links) => {
  //     links.forEach(link => {
  //       const linkUrl = link.url || link.href;
  //       if (linkUrl) {
  //         const cleanHref = cleanLink(linkUrl);  // Clean the link here
  //         console.log(`Collected and cleaned link: ${cleanHref}`);  // Debug log to show cleaned links
  //         allLinks.push(cleanHref);  // Collect the cleaned link
  //       }
  //       if (link.embedded_links && link.embedded_links.length > 0) {
  //         collectAllLinks(link.embedded_links);  // Recursively collect embedded links
  //       }
  //     });
  //   };
  
  //   // Call `collectAllLinks` for each category in scrapeResult
  //   Object.entries(scrapeResult.result.categories).forEach(([category, links]) => {
  //     collectAllLinks(links);
  //   });
  
  //   if (allLinks.length === 0) {
  //     setError('No valid links found to check liveness.');
  //     return;
  //   }
  
  //   setLoading(true);  // Show spinner while fetching
  
  //   try {
  //     const livenessResponse = await fetch('http://localhost:3002/check-liveness', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ urls: allLinks }),
  //     });
  
  //     if (!livenessResponse.ok) {
  //       throw new Error(`Failed to check liveness, status: ${livenessResponse.status}`);
  //     }
  
  //     const livenessData = await livenessResponse.json();
  //     console.log('Liveness Data for Scraped Links: ', livenessData);  // Log the result
  
  //     // Transform the liveness data into a map for easy lookup
  //     const statusMap = {};
  //     livenessData.forEach(({ url, status, statusCode }) => {
  //       const cleanHref = cleanLink(url); 
  //       statusMap[cleanHref] = {
  //         live: status === 'live',
  //         statusCode: statusCode || 'N/A',
  //       };
  //     });
  
  //     setLivenessStatusMap(statusMap);  // Set the liveness status map
  
  //   } catch (error) {
  //     setError(`Failed to check liveness for scraped links: ${error.message}`);
  //   } finally {
  //     setLoading(false);  // Hide spinner when done
  //   }
  // };  
  // Handle liveness check for all scraped links
// const handleCheckLivenessForScrapedLinks = async () => {
//   setError(null); // Clear previous errors
//   setLivenessStatus([]); // Reset previous liveness statuses
//   const allLinks = new Set();

//   // Collect all unique links and embedded links from scrapeResult
//   const collectAllLinks = (links) => {
//     links.forEach(link => {
//       const linkUrl = link.url || link.href;
//       if (linkUrl) {
//         const cleanedLink = cleanLink(linkUrl); // Clean each link
//         allLinks.add(cleanedLink); // Use Set to avoid duplicates
//       }
//       if (link.embedded_links && link.embedded_links.length > 0) {
//         collectAllLinks(link.embedded_links); // Recursively collect embedded links
//       }
//     });
//   };

//   // Ensure scrapeResult and categories are populated
//   if (!scrapeResult || !scrapeResult.some(({ links }) => links.length > 0)) {
//     setError('No links to check liveness for. Please scrape a URL first.');
//     return;
//   }

//   // Collect all links from scrapeResult
//   scrapeResult.forEach(({ links }) => {
//     collectAllLinks(links);
//   });

//   if (allLinks.size === 0) {
//     setError('No valid links found to check liveness.');
//     return;
//   }

//   setLoading(true);  // Show spinner during the API call

//   try {
//     const livenessResponse = await fetch('http://localhost:3002/check-liveness', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ urls: Array.from(allLinks) }), // Convert Set to Array
//     });

//     if (!livenessResponse.ok) {
//       throw new Error(`Failed to check liveness, status: ${livenessResponse.status}`);
//     }

//     const livenessData = await livenessResponse.json();
//     console.log('Liveness Data for Scraped Links:', livenessData);  // Log response data

//     // Transform the liveness data into a map for easy lookup
//     const statusMap = {};
//     livenessData.forEach(({ url, status, statusCode }) => {
//       const cleanedUrl = cleanLink(url); 
//       statusMap[cleanedUrl] = {
//         live: status === 'live',
//         statusCode: statusCode || 'N/A',
//       };
//     });

//     setLivenessStatusMap(statusMap);  // Update state with liveness status map

//   } catch (error) {
//     setError(`Failed to check liveness for scraped links: ${error.message}`);
//   } finally {
//     setLoading(false);  // Hide spinner after API call completes
//   }
// };
const handleCheckLivenessForScrapedLinks = async () => {
  setLivenessStatusMap({}); // Reset livenessStatusMap before fetching new data
  setError(null);
  setLivenessStatus([]);
  const allLinks = new Set();

  const collectAllLinks = (links) => {
    links.forEach(link => {
      const linkUrl = link.url || link.href;
      if (linkUrl) {
        const cleanedLink = cleanLink(linkUrl);
        allLinks.add(cleanedLink);
      }
      if (link.embedded_links && link.embedded_links.length > 0) {
        collectAllLinks(link.embedded_links);
      }
    });
  };

  if (!scrapeResult || !scrapeResult.some(({ links }) => links.length > 0)) {
    setError('No links to check liveness for. Please scrape a URL first.');
    return;
  }

  scrapeResult.forEach(({ links }) => {
    collectAllLinks(links);
  });

  if (allLinks.size === 0) {
    setError('No valid links found to check liveness.');
    return;
  }

  setLoading(true);

  try {
    const livenessResponse = await fetch('http://localhost:3002/check-liveness', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: Array.from(allLinks) }),
    });

    if (!livenessResponse.ok) {
      throw new Error(`Failed to check liveness, status: ${livenessResponse.status}`);
    }

    const livenessData = await livenessResponse.json();

    const statusMap = {};
    livenessData.forEach(({ url, status, statusCode }) => {
      const cleanedUrl = cleanLink(url);
      statusMap[cleanedUrl] = {
        live: status === 'live',
        statusCode: statusCode || 'N/A',
      };
    });

    setLivenessStatusMap(statusMap);

  } catch (error) {
    setError(`Failed to check liveness for scraped links: ${error.message}`);
  } finally {
    setLoading(false);
  }
};

// const handleExportToPDF = () => {
//   const doc = new jsPDF();

//   // Table data setup
//   const rows = [];
//   scrapeResult.forEach((result, index) => {
//     rows.push([`Category ${index + 1}: ${result.category}`, '', '']);
    
//     result.links.forEach((link) => {
//       const livenessStatus = livenessStatusMap[link.url] || { live: false, statusCode: 'N/A' };
//       const statusText = `${livenessStatus.live ? 'Live' : 'Not Live'} (Status Code: ${livenessStatus.statusCode})`;

//       rows.push([
//         link.title || 'No title available',
//         link.url || 'No URL available',
//         statusText,
//       ]);

//       if (link.embedded_links && link.embedded_links.length > 0) {
//         link.embedded_links.forEach((embeddedLink) => {
//           const embeddedLivenessStatus = livenessStatusMap[embeddedLink.url] || { live: false, statusCode: 'N/A' };
//           const embeddedStatusText = `${embeddedLivenessStatus.live ? 'Live' : 'Not Live'} (Status Code: ${embeddedLivenessStatus.statusCode})`;

//           rows.push([
//             `- Embedded: ${embeddedLink.title || 'No title available'}`,
//             embeddedLink.url || 'No URL available',
//             embeddedStatusText,
//           ]);
//         });
//       }
//     });

//     rows.push(['', '', '']); // Spacer row for better readability
//   });

//   // Using autoTable to generate the PDF table with compact header and styles
//   doc.autoTable({
//     head: [['Title', 'URL', 'Liveness Status']],
//     body: rows,
//     startY: 10,
//     theme: 'grid',
//     styles: {
//       fontSize: 8,           // Reduce overall font size
//       cellPadding: 1,        // Smaller cell padding for compact layout
//     },
//     headStyles: {
//       fillColor: [115, 147, 179],
//       textColor: [255, 255, 255],
//       fontSize: 8,           // Smaller font size for the header
//       cellPadding: 1,        // Reduce padding for header cells
//     },
//     margin: { top: 15 },
//     didDrawPage: (data) => {
//       doc.setFontSize(12);
//       doc.text('Scrape Results', data.settings.margin.left, 8);
//     },
//   });

//   doc.save('ScrapeResultsWithLiveness.pdf');
// };
const handleExportToPDF = () => {
  const doc = new jsPDF();

  // Table data setup
  const rows = [];
  scrapeResult.forEach((result, index) => {
    rows.push([`Category ${index + 1}: ${result.category}`, '', '']);
    
    result.links.forEach((link) => {
      const livenessStatus = livenessStatusMap[link.url] || { live: false, statusCode: 'N/A' };
      const statusText = `${livenessStatus.live ? 'Live' : 'Not Live'} (Status Code: ${livenessStatus.statusCode})`;

      rows.push([
        link.title || 'No title available',
        link.url || 'No URL available',
        statusText,
      ]);

      if (link.embedded_links && link.embedded_links.length > 0) {
        link.embedded_links.forEach((embeddedLink) => {
          const embeddedLivenessStatus = livenessStatusMap[embeddedLink.url] || { live: false, statusCode: 'N/A' };
          const embeddedStatusText = `${embeddedLivenessStatus.live ? 'Live' : 'Not Live'} (Status Code: ${embeddedLivenessStatus.statusCode})`;

          rows.push([
            `- Embedded: ${embeddedLink.title || 'No title available'}`,
            embeddedLink.url || 'No URL available',
            embeddedStatusText,
          ]);
        });
      }
    });

    rows.push(['', '', '']); // Spacer row for better readability
  });

  // Using autoTable to generate the PDF table with compact header and styles
  doc.autoTable({
    head: [['Title', 'URL', 'Liveness Status']],
    body: rows,
    startY: 10,
    theme: 'grid',
    styles: {
      fontSize: 8,           // Reduce overall font size
      cellPadding: 1,        // Smaller cell padding for compact layout
    },
    headStyles: {
      fillColor: [115, 147, 179],
      textColor: [255, 255, 255],
      fontSize: 8,           // Smaller font size for the header
      cellPadding: 1,        // Reduce padding for header cells
    },
    margin: { top: 15 },
    didDrawPage: (data) => {
      doc.setFontSize(12);
      doc.text('Scrape Results', data.settings.margin.left, 8);
    },
  });

  doc.save('ScrapeResultsWithLiveness.pdf');
};

  const handleCheckLiveness = async () => {
    setError(null);
    setLivenessStatus([]);

    if (!url) {
      setError('Please enter at least one URL.');
      return;
    }

    const urlArray = url.trim().split(/\n+/).map(line => line.trim()).filter(Boolean);

    setLoading(true);

    try {
      const livenessResponse = await fetch('http://localhost:3002/check-liveness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ urls: urlArray }),
      });

      const livenessData = await livenessResponse.json();
      setLivenessStatus(livenessData);
    } catch (error) {
      setError(`Failed to check liveness: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

// const processBackendData = (data) => {
//   console.log('Backend categories data in processBackendData:', JSON.stringify(data, null, 2));

//   return Object.entries(data).map(([category, links]) => ({
//       category,
//       links: links.map(link => ({
//           url: cleanLink(link.url || 'No link available'), // Apply cleanLink here
//           title: link.additionalData?.title || 'No title available',
//           content: link.additionalData?.content?.title || 'No content available',
//           embedded_links: link.embedded_links
//               ? link.embedded_links
//                   .filter(embeddedUrl => embeddedUrl !== link.url) // Filter out duplicate URLs
//                   .map(embeddedUrl => ({
//                       url: cleanLink(embeddedUrl), // Clean each embedded link here
//                       title: 'No title available',
//                       content: 'No content available',
//                   }))
//               : []
//       }))
//   }));
// };

const processBackendData = (data) => {
  console.log('Backend categories data in processBackendData:', JSON.stringify(data, null, 2));

  return Object.entries(data).map(([category, links]) => ({
      category,
      links: links.map(link => ({
          url: cleanLink(link.url )|| 'No link available',
          title: link.additionalData?.title || 'No title available',
          // content: link.additionalData?.content?.title || 'No content available',
          embedded_links: link.embedded_links
              ? link.embedded_links.map(embeddedUrl => ({
                    url: cleanLink(embeddedUrl),
                    title: 'No title available',
                    // content: 'No content available',
                }))
              : []
      }))
  }));
};

// const processBackendData = (data) => {
//   console.log('Backend categories data in processBackendData:', JSON.stringify(data, null, 2));

//   return Object.entries(data.categories).map(([categoryUrl, links]) => ({
//       category: categoryUrl,
//       links: links.map(link => {
//           const linkUrl = cleanLink(link.url || 'No link available');
//           const title = link.additionalData?.title || 'No title available';


//           // Filter out any embedded link that matches the main URL
//           const uniqueEmbeddedLinks = (link.embedded_links || [])
//               .filter(embeddedUrl => cleanLink(embeddedUrl) !== linkUrl)
//               .map(embeddedUrl => ({
//                   url: cleanLink(embeddedUrl), // Clean each embedded link
//                   title: 'No title available',
//               }));

//           return {
//               url: linkUrl,
//               title,
//               embedded_links: uniqueEmbeddedLinks
//           };
//       })
//   }));
// };


// Recursive function to render the scraped links and their liveness status
// const renderRecursiveLinks = (links = [], livenessStatusMap = {}, isParent = true, renderedUrls = new Set(), depth = 1) => {
//   if (!Array.isArray(links) || links.length === 0) {
//     return (
//       <Typography variant="body2" sx={{ color: '#777' }}>
//         No links found.
//       </Typography>
//     );
//   }

//   return (
//     <List sx={{ paddingLeft: isParent ? '0px' : '20px' }}>
//       {links.map((link, index) => {
//         const url = cleanLink(link.url) || 'No link available';
        
//         // Skip rendering if this URL has already been rendered
//         if (renderedUrls.has(url)) {
//           return null;
//         }

//         renderedUrls.add(url); // Mark URL as rendered to avoid duplicates

//         const title = link.title || 'No title available';
//         const embeddedLinks = link.embedded_links || [];
//         const livenessStatus = livenessStatusMap[url] || { live: false, statusCode: 'N/A' };

//         return (
//           <ListItem key={`${url}-${depth}-${index}`} sx={{ display: 'block', marginBottom: '10px' }}>
//             <Box sx={{ display: 'flex', flexDirection: 'column' }}>
//               {/* Main link */}
//               <Typography variant={isParent ? 'h6' : 'body2'}>
//                 <a href={url} target="_blank" rel="noopener noreferrer">
//                   {url}
//                 </a>
//               </Typography>

//               {/* Liveness status */}
//               {Object.keys(livenessStatusMap).length > 0 && (
//                 <Typography variant="body2" sx={{ marginLeft: '10px', color: livenessStatus.live ? 'green' : 'red' }}>
//                   {livenessStatus.live
//                     ? `🟢 Live (Status Code: ${livenessStatus.statusCode})`
//                     : `🔴 Not Live (Status Code: ${livenessStatus.statusCode})`}
//                 </Typography>
//               )}

//               {/* Title of the link */}
//               <Typography variant="body2">Title: {title}</Typography>

//               {/* Render embedded links recursively */}
//               {embeddedLinks.length > 0 && (
//                 <Box sx={{ marginLeft: '20px', marginTop: '10px' }}>
//                   <Typography variant="body2" sx={{ fontWeight: 'bold', marginBottom: '5px' }}>Embedded Links (Depth {depth + 1}):</Typography>
//                   {renderRecursiveLinks(embeddedLinks, livenessStatusMap, false, renderedUrls, depth + 1)}
//                 </Box>
//               )}
//             </Box>
//           </ListItem>
//         );
//       })}
//     </List>
//   );
// };

const renderRecursiveLinks = (links = [], livenessStatusMap = {}, renderedUrls = new Set()) => {
  if (!Array.isArray(links) || links.length === 0) {
    return (
      <Typography variant="body2" sx={{ color: '#777' }}>
        No links found.
      </Typography>
    );
  }

  return (
    <List sx={{ paddingLeft: '0px' }}>
      {links.map((link, index) => {
        const url = link.url || 'No link available';

        if (renderedUrls.has(url)) return null;
        renderedUrls.add(url);

        const title = link.title || 'No title available';
        const embeddedLinks = link.embedded_links || [];
        const livenessStatus = livenessStatusMap[url];

        return (
          <ListItem key={`${url}-${index}`} sx={{ display: 'block', marginBottom: '10px' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6">
                <a href={url} target="_blank" rel="noopener noreferrer">
                  {url}
                </a>
              </Typography>

              {/* Conditionally render liveness status only if livenessStatusMap is populated */}
              {livenessStatus && (
                <Typography variant="body2" sx={{ color: livenessStatus.live ? 'green' : 'red' }}>
                  {livenessStatus.live
                    ? `🟢 Live (Status Code: ${livenessStatus.statusCode})`
                    : `🔴 Not Live (Status Code: ${livenessStatus.statusCode})`}
                </Typography>
              )}

              <Typography variant="body2">Title: {title}</Typography>

              {embeddedLinks.length > 0 && (
                <Box sx={{ marginLeft: '20px', marginTop: '10px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', marginBottom: '5px' }}>
                    Embedded Links:
                  </Typography>
                  <List>
                    {embeddedLinks.map((embeddedLink, idx) => {
                      const embeddedUrl = embeddedLink.url;
                      const embeddedLivenessStatus = livenessStatusMap[embeddedUrl];

                      return (
                        <ListItem key={`${embeddedUrl}-${idx}`}>
                          <Typography variant="body2">
                            <a href={embeddedUrl} target="_blank" rel="noopener noreferrer">
                              {embeddedUrl}
                            </a>
                            {embeddedLivenessStatus && (
                              <Typography variant="body2" sx={{ color: embeddedLivenessStatus.live ? 'green' : 'red', marginLeft: '10px' }}>
                                {embeddedLivenessStatus.live
                                  ? `🟢 Live (Status Code: ${embeddedLivenessStatus.statusCode})`
                                  : `🔴 Not Live (Status Code: ${embeddedLivenessStatus.statusCode})`}
                              </Typography>
                            )}
                          </Typography>
                        </ListItem>
                      );
                    })}
                  </List>
                </Box>
              )}
            </Box>
          </ListItem>
        );
      })}
    </List>
  );
};



  // Function to render liveness status with emoji and status code
  const renderLivenessStatus = () => {
    if (!livenessStatus || livenessStatus.length === 0) return null;
  
    return (
      <Paper elevation={3} sx={{ padding: '20px', marginTop: '30px', marginBottom: '30px' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#7393b3', marginBottom: '10px' }}>
          Liveness Check Results
        </Typography>
        <List>
          {livenessStatus.map((status, index) => (
            <ListItem key={index} sx={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
              <Typography variant="body1" sx={{ fontWeight: 'bold', marginRight: '10px' }}>
                <a href={status.url} target="_blank" rel="noopener noreferrer">
                  {status.url}
                </a>
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                {status.status === 'live' ? '🟢' : '🔴'}
                <Typography variant="body2" sx={{ marginLeft: '5px', color: status.status === 'live' ? 'green' : 'red' }}>
                  (Status Code: {status.statusCode || 'N/A'})
                </Typography>
              </Typography>
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };  
  
  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
    setUrl('');
    setError(null);
    setScrapeResult(null);
    setLivenessStatus([]);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ textAlign: 'center', marginTop: '50px' }}>
      <Box
          component="img"
          src="/brokenchain.png" 
          sx={{
            width: '80px',
            height: 'auto',
            marginBottom:'10px'
          }} />
        <Box
        component="img"
        src="/scraper.png" 
        sx={{
          width: '80px',
          height: 'auto',
          marginBottom:'10px'
        }} />
        
      <Box sx={{ textAlign: 'center', marginTop: '50px' }}>
        <Typography variant="h3" sx={{ fontFamily: 'Georgia', marginBottom: '25px', fontWeight: 'bold' }} gutterBottom>
          Broken Link Scanner & Web Scraper
        </Typography>

        {/* Documentation button */}
        <Button
            color="inherit"
            onClick={() => window.open('http://localhost:3003', '_blank')}
          >
            Documentation
          </Button>

        <Tabs value={activeTab} onChange={handleTabChange} centered>
          <Tab label="Scraping" />
          <Tab label="Link Checker" />
        </Tabs>

        <TextField
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          label={activeTab === 0 ? 'Enter URL for Scraping and Summarization' : 'Enter URLs here, leave a line between each URL'}
          multiline
          rows={10}
          variant="outlined"
          sx={{ width: '450px', marginTop: '20px', marginBottom: '20px' }}
        />

        {error && (
          <Typography variant="body1" color="error">
            {error}
          </Typography>
        )}

        {activeTab === 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: '20px' }}>
            <Button
              onClick={handleScrape}
              variant="contained"
              color="primary"
              sx={{ padding: '10px 20px' }}
            >
              Scrape & Summarize
            </Button>
          </Box>
        )}

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
            <CircularProgress />
          </Box>
        )}

{scrapeResult && Array.isArray(scrapeResult) && scrapeResult.length > 0 ? (
    <Paper id="scrapeResults" elevation={3} sx={{ padding: '20px', marginTop: '30px', marginBottom: '30px' }}>
        {scrapeResult.map(({ category, links }, index) => (
            <Box key={index} sx={{ marginBottom: '25px' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#7393b3', marginBottom: '10px' }}>
                    Scrape Results:
                </Typography>

                {/* Check Liveness Button */}
                <Box sx={{ textAlign: 'center', marginTop: '20px', marginBottom: '20px' }}>
                    <Button onClick={handleCheckLivenessForScrapedLinks} variant="contained" color="primary" sx={{ padding: '10px 20px' }}>
                        Check Liveness for All Links
                    </Button>
                </Box>
                <Button onClick={handleExportToPDF} variant="contained" color="secondary" sx={{ marginTop: '20px' }}>
                  Export to PDF
                </Button>
                {/* Render the links recursively */}
                {Array.isArray(links) ? renderRecursiveLinks(links, livenessStatusMap) : <Typography>No valid links found.</Typography>}
            </Box>
        ))}
    </Paper>
) : null}

        {/* Render liveness status */}
        {renderLivenessStatus()}

        {activeTab === 1 && (
          <Box sx={{ textAlign: 'center', marginTop: '20px' }}>
            <Button
              onClick={handleCheckLiveness}
              variant="contained"
              color="primary"
              sx={{ padding: '10px 20px' }}
            >
              Check Liveness for Entered URLs
            </Button>
          </Box>
        )}
      </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
